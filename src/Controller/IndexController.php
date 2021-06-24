<?php
// src/Controller/IndexController.php
namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class IndexController extends BaseController
{

    public function index(): Response
    {
		return $this->render(parent::getMainTemplateFile(), [
			'contentPage' => 'pages/index.html.twig'
		]);
    }
}